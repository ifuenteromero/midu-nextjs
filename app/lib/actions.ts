'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(['pending', 'paid']),
	date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {
	const rawFormData = {
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	};
	// const rawFormData2 = Object.fromEntries(formData.entries());

	const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
	const amountInCents = amount * 100;
	// const date = new Date().toISOString() '2024-08-27T16:10:29.060Z'
	const date = new Date().toISOString().split('T')[0]; // '2024-08-27'
	try {
		await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
	} catch (error) {
		return {
			message: 'Database Error: Failed to Create Invoice.',
		};
	}
	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices'); // Llamada a redirect fuera del try/catch
	/* 
		Explicación:
		redirect fuera del try/catch:

		El comentario señala que la función redirect se llama fuera del bloque try/catch.
		redirect lanza un error:

		La función redirect funciona lanzando un error internamente. Esto es un comportamiento intencional en algunos frameworks para detener la ejecución del código y redirigir al usuario.
		Captura del error por catch:

		Si redirect se llamara dentro del bloque try, el error lanzado por redirect sería capturado inmediatamente por el bloque catch, lo cual no es el comportamiento deseado.
		Llamada a redirect después del try/catch:

		Para evitar que el error lanzado por redirect sea capturado por el bloque catch, se llama a redirect después del bloque try/catch.
		De esta manera, redirect solo se ejecutará si el bloque try es exitoso y no se lanza ningún error dentro de él.

	*/
};

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export const updateInvoice = async (id: string, formData: FormData) => {
	const { customerId, amount, status } = UpdateInvoice.parse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});

	const amountInCents = amount * 100;

	try {
		await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
	} catch (error) {
		return {
			message: 'Database Error: Failed to Update Invoice.',
		};
	}
	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices');
};

export const deleteInvoice = async (id: string) => {
	// throw new Error('Failed to Delete Invoice');
	try {
		await sql`DELETE FROM invoices WHERE id = ${id}`;
		revalidatePath('/dashboard/invoices');
	} catch (error) {
		return {
			message: 'Database Error: Failed to Delete Invoice.',
		};
	}
};
