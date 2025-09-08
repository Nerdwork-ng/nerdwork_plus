ALTER TABLE "user_transactions" DROP CONSTRAINT "user_transactions_user_id_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;