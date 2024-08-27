'use server';

export const createInvoice = async (formData: FormData) => {
	const rawFormData = {
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	};

	// const rawFormData2 = Object.fromEntries(formData.entries());
};
