const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// create a new note
const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const note = await Note.create({
    title,
    content,
    user: req.user._id
  });

  res.status(201).json(note);
});

// get notes with pagination, search, and dynamic sorting (user sees own, admin sees all)
const getNotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);

  let filter = {};
  if (req.user.role !== 'admin') {
    filter.user = req.user._id;
  }

  // Dynamic server-side keyword search (title and content)
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { content: searchRegex }
    ];
  }

  // Dynamic sorting options
  let sortOption = { createdAt: -1 }; // default newest first
  if (req.query.sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (req.query.sort === 'alpha') {
    sortOption = { title: 1 };
  }

  const totalNotes = await Note.countDocuments(filter);
  const notes = await Note.find(filter)
    .populate('user', 'name email role')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  res.json({
    notes,
    page,
    pages: Math.ceil(totalNotes / limit) || 1,
    totalNotes
  });
});

// get single note by id
const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id).populate('user', 'name email');

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  if (note.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view this note' });
  }

  res.json(note);
});

// update note
const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  if (note.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update this note' });
  }

  note.title = req.body.title || note.title;
  note.content = req.body.content || note.content;

  const updatedNote = await note.save();
  res.json(updatedNote);
});

// delete note
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  if (note.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this note' });
  }

  await note.deleteOne();
  res.json({ message: 'Note removed successfully' });
});

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
};
