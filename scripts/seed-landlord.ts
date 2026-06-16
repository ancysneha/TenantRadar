/**
 * Run: npx tsx scripts/seed-landlord.ts
 * Creates a landlord account for credentials login.
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL = process.env.LANDLORD_EMAIL ?? "landlord@example.com";
const PASSWORD = process.env.LANDLORD_PASSWORD ?? "changeme";
const NAME = process.env.LANDLORD_NAME ?? "Demo Landlord";

async function main() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI required");

  await mongoose.connect(MONGODB_URI);

  const Landlord =
    mongoose.models.Landlord ??
    mongoose.model(
      "Landlord",
      new mongoose.Schema({
        email: String,
        passwordHash: String,
        name: String,
      })
    );

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await Landlord.findOneAndUpdate(
    { email: EMAIL.toLowerCase() },
    { email: EMAIL.toLowerCase(), passwordHash, name: NAME },
    { upsert: true }
  );

  console.log(`Landlord seeded: ${EMAIL}`);
  await mongoose.disconnect();
}

main().catch(console.error);
