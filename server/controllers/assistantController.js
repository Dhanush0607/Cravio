import { asyncHandler } from '../utils/asyncHandler.js';
import { chatWithAssistant } from '../services/assistantService.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { message, city, history } = req.body;
  const result = await chatWithAssistant({ message, city, history, user: req.user });

  res.json({ success: true, data: result });
});
