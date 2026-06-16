import { connectDB } from "./lib/mongodb";
import { processMessageWithAgent } from "./lib/agent";
import Message from "./models/Message";
import Tenant from "./models/Tenant";
import Property from "./models/Property";
import Ticket from "./models/Ticket";
import Conversation from "./models/Conversation";
import mongoose from "mongoose";

async function test() {
  await connectDB();
  console.log("Connected to DB");

  // Cleanup old test data
  const testEmail = "test_tenant@example.com";
  await Tenant.deleteOne({ email: testEmail });
  
  // Create a test property
  const property = await Property.create({
    name: "Test Villa",
    address: "123 Test St",
    landlordId: new mongoose.Types.ObjectId().toString(),
  });

  // Create a test tenant
  const tenant = await Tenant.create({
    name: "John Doe",
    email: testEmail,
    propertyId: property._id,
    rentStatus: "paid",
  });

  // Create a conversation
  const convo = await Conversation.create({
    tenantId: tenant._id,
    status: "active",
  });

  // Create a message
  const msg = await Message.create({
    tenantId: tenant._id,
    conversationId: convo._id,
    source: "email",
    body: "The sink is leaking and it is getting worse!",
    status: "pending",
  });

  console.log("Processing message with agent...");
  await processMessageWithAgent({ messageId: msg._id.toString() });

  // Verify the ticket
  const ticket = await Ticket.findOne({ tenantId: tenant._id });
  if (ticket) {
    console.log("Ticket Created Successfully!");
    console.log("Category:", ticket.category);
    console.log("Priority:", ticket.priority);
    console.log("ConversationId:", ticket.conversationId?.toString() === convo._id.toString() ? "Match" : "No Match");
  } else {
    console.log("Ticket creation failed.");
  }

  // Cleanup
  await Ticket.deleteMany({ tenantId: tenant._id });
  await Message.deleteMany({ tenantId: tenant._id });
  await Conversation.deleteOne({ _id: convo._id });
  await Tenant.deleteOne({ _id: tenant._id });
  await Property.deleteOne({ _id: property._id });

  process.exit(0);
}

test();
