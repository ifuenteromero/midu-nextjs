'use server';

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
};
