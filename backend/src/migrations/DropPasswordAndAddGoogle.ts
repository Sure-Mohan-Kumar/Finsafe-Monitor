import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPasswordAndAddGoogle implements MigrationInterface {
  name = "DropPasswordAndAddGoogle";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "password"`);

    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "googleId" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "name" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "avatar" VARCHAR`);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_googleId" ON "user"("googleId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_googleId"`);

    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "googleId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "name"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "avatar"`);

    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "password" VARCHAR`);
  }
}
