alter table if exists public.platform_accounts
ADD CONSTRAINT unique_account_identifier UNIQUE (account_identifier);



alter table if exists public.pages
add account_identifier text not null;
alter table if exists public.pages
ADD CONSTRAINT fk_account_identifier FOREIGN KEY (account_identifier) REFERENCES public.platform_accounts(account_identifier);