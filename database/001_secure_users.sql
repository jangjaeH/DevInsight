ALTER TABLE users
    ADD UNIQUE INDEX ux_users_usercode (usercode);
