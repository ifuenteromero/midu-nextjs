'use server';

import { signIn } from '@/auth';
import { sql } from '@vercel/postgres';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string({
		invalid_type_error: 'Please select a customer.',
	}),
	amount: z.coerce
		.number()
		.gt(0, { message: 'Please enter an amount greater than $0.' }),
	status: z.enum(['pending', 'paid'], {
		invalid_type_error: 'Please select an invoice status.',
	}),
	date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
		status?: string[];
	};
	message?: string | null;
};

export const createInvoice = async (prevState: State, formData: FormData) => {
	const rawFormData = {
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	};
	// const rawFormData2 = Object.fromEntries(formData.entries());

	// Validate form fields using Zod
	const validatedFields = CreateInvoice.safeParse(rawFormData);
	// If form validation fails, return errors early. Otherwise, continue.
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Missing Fields. Failed to Create Invoice.',
		};
	}

	const { customerId, amount, status } = validatedFields.data;
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

export const updateInvoice = async (
	id: string,
	prevState: State,
	formData: FormData
) => {
	const rawFormData = {
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	};
	const validatedFields = UpdateInvoice.safeParse(rawFormData);
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Missing Fields. Failed to Update Invoice.',
		};
	}

	const { customerId, amount, status } = validatedFields.data;

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

export const autheticate = async (
	prevState: string | undefined,
	formData: FormData
) => {
	try {
		await signIn('credentials', formData);
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case 'CredentialsSignin':
					return 'Invalid credentials.';
				default:
					return 'Something went wrong.';
			}
		}
		throw error;
	}
};
