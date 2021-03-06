import * as mongodb from 'mongodb';

import Message from '../models/Message';

const getListOfMessages = async (req, params) => {
  const page = req.query.page || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page * limit) - limit;
  // If user typed a search string to filter by name
  const search = req.query.search;
  if (search) {
    params['$text'] = { $search: search };
  }
  // Query the database for a list of users
  const usersPromise = Message.find(params).skip(skip).limit(limit).sort({ surname: 'asc' });
  const countPromise = Message.countDocuments(params);
  const [messages, count] = await Promise.all([usersPromise, countPromise]);
  const pages = Math.ceil(count / limit);

  return {
    messages,
    count,
    pages
  };
};

export const getAllMessages = async (req, res) => {
  const { messages, count, pages } = await getListOfMessages(req, {});

  res.json({
    data: messages,
    total: count,
    pages
  });
};

export const getMessagesByBranchId = async (req, res) => {
  const { id } = req.params;
  const { messages, count, pages } = await getListOfMessages(req, { branch: id });

  res.json({
    data: messages,
    total: count,
    pages
  });
};

export const getMessagesByGroupId = async (req, res) => {
  const { id } = req.params;
  const { messages, count, pages } = await getListOfMessages(req, { group: id });

  res.json({
    data: messages,
    total: count,
    pages
  });
};

export const getMessagesBySenderId = async (req, res) => {
  const { id } = req.params;
  const { messages, count, pages } = await getListOfMessages(req, { sender: id });

  res.json({
    data: messages,
    total: count,
    pages
  });
};

export const getMessageById = async (req, res) => {
  const { id } = req.params;
  if (!mongodb.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const message = await Message.findById(id);
  if (message) {
    return res.json(message);
  }
  res.json({ error: 'Message not found' });
};

export const addNewMessage = async (req, res) => {
  if (!req.body.group && !req.body.branch) {
    return res.status(400).json({ error: 'Group or Branch should be chosen' });
  }
  // FIXME sender should be taken from active user or by public API key
  const newMessage = new Message({
    group: req.body.group,
    branch: req.body.branch,
    subject: req.body.subject,
    message: req.body.message
  });
  const savedMessage = await newMessage.save();
  // Also, here the message should be sent to the group/branch
  res.json(savedMessage);
};