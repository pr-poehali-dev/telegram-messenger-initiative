
CREATE TABLE t_p64976892_telegram_messenger_i.users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p64976892_telegram_messenger_i.sms_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sms_codes_phone ON t_p64976892_telegram_messenger_i.sms_codes(phone);
CREATE INDEX idx_users_phone ON t_p64976892_telegram_messenger_i.users(phone);
