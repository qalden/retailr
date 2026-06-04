import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import FormInput from '@/components/shared/FormInput';
import { useAppDispatch } from '@/store';
import { createCustomer } from '@/store/slices/customersSlice';
import { customerFormSchema, type CustomerFormSchema } from '@/utils/validators';
import styles from './CustomerCreatePage.module.css';

/**
 * CustomerCreatePage: Form for creating a new customer
 * - Uses FormInput components for form fields
 * - Validates with customerFormSchema
 * - Dispatches createCustomer thunk on submit
 * - Navigates back to /customers on success
 */
const CustomerCreatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = customerFormSchema.safeParse(formData);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        formattedErrors[path] = error.message;
      });
      setErrors(formattedErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      // Convert empty strings to null for optional fields
      const submitData: Omit<CustomerFormSchema, 'phone' | 'address' | 'city' | 'postalCode'> & {
        phone: string | null;
        address: string | null;
        city: string | null;
        postalCode: string | null;
      } = {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        address: result.data.address || null,
        city: result.data.city || null,
        postalCode: result.data.postalCode || null,
      };

      dispatch(createCustomer(submitData));
      // Navigate back to customers list after a short delay to allow state update
      setTimeout(() => {
        navigate('/customers');
      }, 500);
    } catch (error) {
      setErrors({ submit: 'Failed to create customer. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Customer</h1>
          <p className={styles.subtitle}>Fill in the form below to add a new customer</p>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <FormInput
              label="Customer Name"
              type="text"
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
              error={errors.name}
              placeholder="John Doe"
            />

            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
              error={errors.email}
              placeholder="john@example.com"
            />

            <FormInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(value) => handleChange('phone', value)}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
            />

            <FormInput
              label="Address"
              type="text"
              value={formData.address}
              onChange={(value) => handleChange('address', value)}
              error={errors.address}
              placeholder="123 Main Street"
            />

            <FormInput
              label="City"
              type="text"
              value={formData.city}
              onChange={(value) => handleChange('city', value)}
              error={errors.city}
              placeholder="New York"
            />

            <FormInput
              label="Postal Code"
              type="text"
              value={formData.postalCode}
              onChange={(value) => handleChange('postalCode', value)}
              error={errors.postalCode}
              placeholder="10001"
            />

            {errors.submit && (
              <div className={styles.submitError}>{errors.submit}</div>
            )}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => navigate('/customers')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default CustomerCreatePage;
