import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateCopilotReply } from '../services/aiService.js';

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await prisma.chatConversation.findMany({
    where: {
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ success: true, conversations });
});

export const createConversation = asyncHandler(async (req, res) => {
  const conversation = await prisma.chatConversation.create({
    data: {
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
      title: req.body.title || 'New Conversation',
    },
  });
  res.status(201).json({ success: true, conversation });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: req.params.conversationId,
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
    },
  });
  if (!conversation) throw new ApiError(404, 'Conversation not found');

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      sender: 'user',
      text: req.body.text,
    },
  });

  const reply = await generateCopilotReply(req.params.workspaceId, req.body.text);
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      sender: 'ai',
      text: reply.text,
      data: {
        action: reply.action,
        recommendation: reply.data,
      },
    },
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  res.status(201).json({
    success: true,
    message: {
      id: message.id,
      sender: message.sender,
      text: message.text,
      action: reply.action,
      data: reply.data,
      createdAt: message.createdAt,
    },
  });
});
