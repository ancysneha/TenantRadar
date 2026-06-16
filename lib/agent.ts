import { connectDB } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import Property from "@/models/Property";
import Message, { type MessageClassification, type MessageStatus } from "@/models/Message";
import Ticket from "@/models/Ticket";
import { sendEmail } from "@/lib/gmail";

export interface AgentProcessInput {
  messageId: string;
}

export interface AgentDecision {
  classification: MessageClassification;
  agentAction: string;
  agentReply: string;
  status: MessageStatus;
  decisionLog: string;
  createTicket?: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    category: "Electrical" | "Plumbing" | "HVAC" | "General";
  };
  updateRentStatus?: "paid" | "pending" | "overdue";
  escalate?: boolean;
}

interface MessageContext {
  tenantName: string;
  propertyAddress: string;
  messageBody: string;
  conversationHistory: string;
  isFollowUp: boolean;
}

const ELECTRICAL_KEYWORDS = [
  "light", "bulb", "wiring", "switch", "socket", "outlet", "power", "electricity",
  "flickering", "circuit", "breaker"
];

const PLUMBING_KEYWORDS = [
  "leak", "leaking", "tap", "sink", "toilet", "drain", "pipe", "water",
  "flush", "shower", "faucet", "clogged", "overflow", "burst"
];

const HVAC_KEYWORDS = [
  "ac", "air conditioner", "cooling", "heater", "hvac", "ventilation",
  "furnace", "thermostat", "fan", "filter", "heating"
];

const WORSENING_KEYWORDS = [
  "worse", "completely", "stopped", "broken", "emergency", "urgent",
  "today", "now", "still", "not working", "help", "inspect", "immediately"
];

const MAINTENANCE_KEYWORDS = [
  ...ELECTRICAL_KEYWORDS,
  ...PLUMBING_KEYWORDS,
  ...HVAC_KEYWORDS,
  "repair", "maintenance", "fix", "appliance", "door", "window", "lock", "wall", "floor"
];

const PAYMENT_KEYWORDS = ["rent", "payment", "paid", "transfer", "bank", "receipt", "invoice"];

const COMPLAINT_KEYWORDS = ["complaint", "noise", "neighbour", "neighbor", "issue", "harassment", "dog", "barking", "smoking"];

function containsKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function summarizeIssue(messageBody: string): string {
  const trimmed = messageBody.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}...`;
}


function analyzeMessageLocally(context: MessageContext): AgentDecision {
  const { tenantName, propertyAddress, messageBody, conversationHistory, isFollowUp } =
    context;

  const normalizedBody = messageBody.toLowerCase();
  const isWorsening = containsKeyword(normalizedBody, WORSENING_KEYWORDS);
  const isElectrical = containsKeyword(normalizedBody, ELECTRICAL_KEYWORDS);
  const isPlumbing = containsKeyword(normalizedBody, PLUMBING_KEYWORDS);
  const isMaintenance = containsKeyword(normalizedBody, MAINTENANCE_KEYWORDS);

  const historyNote = conversationHistory
    ? `\n\nConversation context reviewed:\n${conversationHistory}`
    : "";

  // Check if history contains maintenance
  const historyHasMaintenance = conversationHistory.toLowerCase().includes("maintenance") || 
                                conversationHistory.toLowerCase().includes("ticket");

  if (isMaintenance || (isFollowUp && historyHasMaintenance)) {
    let category = "General";
    const isHVAC = containsKeyword(normalizedBody, HVAC_KEYWORDS);

    if (isElectrical) category = "Electrical";
    else if (isPlumbing) category = "Plumbing";
    else if (isHVAC) category = "HVAC";

    const priority = isWorsening ? "high" : "medium";
    const title = `${category} Maintenance: ${summarizeIssue(messageBody)}`;
    
    let agentReply = "";
    let actionLabel = "";

    if (isFollowUp && historyHasMaintenance) {
      if (isWorsening) {
        actionLabel = `Escalated ${category.toLowerCase()} maintenance ticket to High Priority`;
        agentReply = `Hi ${tenantName},\n\nI'm sorry to hear that the issue at ${propertyAddress} has worsened. I have escalated this to High Priority and updated the existing work order. We are working to get someone out to you as soon as possible today.\n\nPlease stay safe and let us know if there are any further developments.\n\nBest regards,\nTenantRadar AI Agent`;
      } else {
        actionLabel = `Updated ${category.toLowerCase()} maintenance ticket`;
        agentReply = `Hi ${tenantName},\n\nThank you for the follow-up regarding the maintenance at ${propertyAddress}. I've added your latest notes to the open ticket for our maintenance team to review.\n\nWe will keep you updated on the progress.\n\nBest regards,\nTenantRadar AI Agent`;
      }
    } else {
      actionLabel = `Created ${category.toLowerCase()} maintenance ticket`;
      agentReply = `Hi ${tenantName},\n\nThank you for reporting the ${category.toLowerCase()} issue at ${propertyAddress}. I have created a maintenance ticket for you with ${priority} priority.\n\nOur team will review this and schedule a repair shortly.\n\nBest regards,\nTenantRadar AI Agent`;
    }

    return {
      classification: "maintenance",
      agentAction: actionLabel,
      agentReply,
      status: isWorsening ? "escalated" : "handled",
      decisionLog: `Local engine detected ${category.toLowerCase()} issue.${isWorsening ? " Worsening conditions detected." : ""}${historyNote}`,
      createTicket: {
        title,
        description: messageBody.trim(),
        priority,
        category: category as any,
      },
      escalate: isWorsening,
    };
  }

  if (containsKeyword(normalizedBody, PAYMENT_KEYWORDS)) {
    return {
      classification: "payment",
      agentAction: "Acknowledged payment inquiry.",
      agentReply: `Hi ${tenantName},\n\nThank you for your message regarding payment for ${propertyAddress}. I've noted this in our system. If you've just made a payment, please allow 24-48 hours for it to reflect in your portal.\n\nBest regards,\nTenantRadar AI Agent`,
      status: "handled",
      decisionLog: `Local engine matched payment keywords.${historyNote}`,
      escalate: false,
    };
  }

  if (containsKeyword(normalizedBody, COMPLAINT_KEYWORDS)) {
    return {
      classification: "complaint",
      agentAction: "Escalated complaint to management.",
      agentReply: `Hi ${tenantName},\n\nI've received your concern regarding ${propertyAddress}. I have escalated this to our property management team for immediate review. Someone will be in touch with you shortly to discuss this further.\n\nBest regards,\nTenantRadar AI Agent`,
      status: "escalated",
      decisionLog: `Local engine matched complaint keywords.${historyNote}`,
      escalate: true,
    };
  }

  return {
    classification: "general",
    agentAction: "Responded to general inquiry.",
    agentReply: `Hi ${tenantName},\n\nThank you for your message regarding ${propertyAddress}. I've received your inquiry and will make sure it's reviewed by our team.\n\nIf you have any other questions, feel free to reply.\n\nBest regards,\nTenantRadar AI Agent`,
    status: "handled",
    decisionLog: `Local engine classified as general inquiry.${historyNote}`,
    escalate: false,
  };
}

function buildConversationHistory(
  messages: Array<{ body: string; agentReply?: string; receivedAt: Date }>
): string {
  return messages
    .map((entry, index) => {
      const lines = [`[${index + 1}] Tenant (${entry.receivedAt.toISOString()}): ${entry.body}`];
      if (entry.agentReply) {
        lines.push(`    AI: ${entry.agentReply}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export async function processMessageWithAgent(
  input: AgentProcessInput
): Promise<AgentDecision> {
  await connectDB();

  const message = await Message.findById(input.messageId).populate("tenantId");
  if (!message) {
    throw new Error("Message not found");
  }

  const tenant = await Tenant.findById(message.tenantId).populate("propertyId");
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const property = await Property.findById(tenant.propertyId);

  const historyMessages = await Message.find({
    conversationId: message.conversationId,
    receivedAt: { $lte: message.receivedAt },
  })
    .sort({ receivedAt: -1 })
    .limit(10)
    .lean();

  const chronological = [...historyMessages].reverse();
  const conversationHistory = buildConversationHistory(chronological);
  const isFollowUp = chronological.length > 1;

  const decision = analyzeMessageLocally({
    tenantName: tenant.name,
    propertyAddress: property?.address ?? "your property",
    messageBody: message.body,
    conversationHistory,
    isFollowUp,
  });

  message.classification = decision.classification;
  message.agentAction = decision.agentAction;
  message.agentReply = decision.agentReply;
  message.status = decision.escalate ? "escalated" : decision.status;
  message.decisionLog = decision.decisionLog;
  await message.save();

  if (decision.createTicket && property) {
    const existingOpenTicket = await Ticket.findOne({
      tenantId: tenant._id,
      propertyId: property._id,
      status: { $in: ["open", "in_progress"] },
    });

    if (existingOpenTicket) {
      // Update existing ticket instead of creating new one
      existingOpenTicket.description += `\n\n[Follow-up ${new Date().toISOString()}]: ${decision.createTicket.description}`;
      if (decision.createTicket.priority === "high") {
        existingOpenTicket.priority = "high";
      }
      await existingOpenTicket.save();
      
      // Update decision log to reflect update
      message.decisionLog += `\nExisting ticket ${existingOpenTicket._id} updated.`;
      await message.save();
    } else {
      await Ticket.create({
        tenantId: tenant._id,
        propertyId: property._id,
        conversationId: message.conversationId,
        category: decision.createTicket.category,
        title: decision.createTicket.title,
        description: decision.createTicket.description,
        priority: decision.createTicket.priority,
        status: "open",
      });
    }
  }

  if (decision.updateRentStatus) {
    tenant.rentStatus = decision.updateRentStatus;
    await tenant.save();
  }

  if (decision.agentReply && tenant.email) {
    try {
      await sendEmail({
        to: tenant.email,
        subject: "Re: Your message to property management",
        text: decision.agentReply,
      });
    } catch (err) {
      console.error("Failed to send agent reply email:", err);
    }
  }

  return decision;
}

export function generateRentReminder(tenantName: string, amount: number, address: string, status: string): string {
  const isOverdue = status === "overdue";
  
  if (isOverdue) {
    return `Hi ${tenantName},\n\nOur system indicates that the rent for ${address} is now overdue. The amount outstanding is $${amount}.\n\nPlease ensure this is settled as soon as possible to avoid any late fees or further action. If you have already made the payment, please ignore this message.\n\nBest regards,\nTenantRadar AI Agent`;
  }
  
  return `Hi ${tenantName},\n\nThis is a friendly reminder that your rent for ${address} is due shortly. The monthly amount is $${amount}.\n\nThank you for your prompt attention to this.\n\nBest regards,\nTenantRadar AI Agent`;
}
