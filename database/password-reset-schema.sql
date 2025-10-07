-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- OTP verification table
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('password_reset', 'phone_verification')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_otp_verifications_user_id ON otp_verifications(user_id);
CREATE INDEX idx_otp_verifications_phone ON otp_verifications(phone);
CREATE INDEX idx_otp_verifications_otp_code ON otp_verifications(otp_code);
CREATE INDEX idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- Create function to clean up expired tokens and OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    -- Delete expired OTP verifications
    DELETE FROM otp_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create function to generate secure OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS VARCHAR(6) AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to validate OTP
CREATE OR REPLACE FUNCTION validate_otp(
    p_phone VARCHAR(20),
    p_otp_code VARCHAR(6),
    p_type VARCHAR(20)
)
RETURNS TABLE (
    is_valid BOOLEAN,
    user_id UUID,
    message TEXT
) AS $$
DECLARE
    v_otp_record RECORD;
    v_user_record RECORD;
BEGIN
    -- Get the most recent OTP for this phone and type
    SELECT * INTO v_otp_record
    FROM otp_verifications
    WHERE phone = p_phone 
      AND type = p_type
      AND expires_at > NOW()
      AND verified_at IS NULL
      AND attempts < max_attempts
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if OTP exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Invalid or expired OTP'::TEXT;
        RETURN;
    END IF;
    
    -- Check if OTP matches
    IF v_otp_record.otp_code != p_otp_code THEN
        -- Increment attempts
        UPDATE otp_verifications 
        SET attempts = attempts + 1
        WHERE id = v_otp_record.id;
        
        RETURN QUERY SELECT false, NULL::UUID, 'Invalid OTP code'::TEXT;
        RETURN;
    END IF;
    
    -- Get user ID
    SELECT id INTO v_user_record
    FROM users
    WHERE phone = p_phone AND is_active = true;
    
    -- Mark OTP as verified
    UPDATE otp_verifications 
    SET verified_at = NOW()
    WHERE id = v_otp_record.id;
    
    RETURN QUERY SELECT true, v_user_record.id, 'OTP verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;
