-- Create function to generate installments for a transaction (fixed parameter order)
CREATE OR REPLACE FUNCTION public.create_transaction_with_installments(
  p_tenant_id uuid,
  p_type text,
  p_description text,
  p_total_value numeric(14,2),
  p_party_id uuid DEFAULT NULL,
  p_num_installments integer DEFAULT 1,
  p_interval_days integer DEFAULT 30,
  p_first_due_date date DEFAULT CURRENT_DATE,
  p_payment_method text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id uuid;
  v_installment_value numeric(14,2);
  v_remaining_value numeric(14,2);
  v_due_date date;
  i integer;
BEGIN
  -- Validate inputs
  IF p_total_value <= 0 THEN
    RAISE EXCEPTION 'Total value must be positive';
  END IF;
  
  IF p_num_installments < 1 THEN
    RAISE EXCEPTION 'Number of installments must be at least 1';
  END IF;
  
  IF p_type NOT IN ('pagar', 'receber') THEN
    RAISE EXCEPTION 'Type must be either pagar or receber';
  END IF;

  -- Create the main transaction
  INSERT INTO public.transactions (
    tenant_id,
    type,
    description,
    party_id,
    amount,
    total_value,
    num_installments,
    installment_interval_days,
    first_due_date,
    payment_method,
    due_date,
    status
  ) VALUES (
    p_tenant_id,
    p_type,
    p_description,
    p_party_id,
    p_total_value,
    p_total_value,
    p_num_installments,
    p_interval_days,
    p_first_due_date,
    p_payment_method,
    p_first_due_date,
    'pending'
  ) RETURNING id INTO v_transaction_id;

  -- Calculate installment value (equal division)
  v_installment_value := ROUND(p_total_value / p_num_installments, 2);
  v_remaining_value := p_total_value;

  -- Create installments
  FOR i IN 1..p_num_installments LOOP
    -- Calculate due date for this installment
    v_due_date := p_first_due_date + (i - 1) * p_interval_days;
    
    -- For the last installment, use remaining value to handle rounding
    IF i = p_num_installments THEN
      v_installment_value := v_remaining_value;
    END IF;
    
    -- Insert installment
    INSERT INTO public.installments (
      transaction_id,
      tenant_id,
      installment_number,
      emission_date,
      due_date,
      value,
      status
    ) VALUES (
      v_transaction_id,
      p_tenant_id,
      i,
      CURRENT_DATE,
      v_due_date,
      v_installment_value,
      'pending'
    );
    
    -- Subtract from remaining value
    v_remaining_value := v_remaining_value - v_installment_value;
  END LOOP;

  RETURN v_transaction_id;
END;
$$;

-- Create function to mark installment as paid
CREATE OR REPLACE FUNCTION public.mark_installment_paid(
  p_installment_id uuid,
  p_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id uuid;
  v_all_paid boolean;
BEGIN
  -- Update the installment
  UPDATE public.installments 
  SET status = 'paid', paid_at = NOW()
  WHERE id = p_installment_id AND tenant_id = p_tenant_id
  RETURNING transaction_id INTO v_transaction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Installment not found or access denied';
  END IF;
  
  -- Check if all installments for this transaction are paid
  SELECT NOT EXISTS (
    SELECT 1 FROM public.installments 
    WHERE transaction_id = v_transaction_id AND status != 'paid'
  ) INTO v_all_paid;
  
  -- Update transaction status if all installments are paid
  IF v_all_paid THEN
    UPDATE public.transactions 
    SET status = 'paid' 
    WHERE id = v_transaction_id;
  END IF;
END;
$$;