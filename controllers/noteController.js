const Note = require('../models/Note');

// create a new note
const createNote = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// get notes with pagination (regular user gets own notes, admin gets all notes)
const getNotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // regular user sees only their own notes, admin can view everyone's notes
    let filter = {};
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    const totalNotes = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      notes,
      page,
      pages: Math.ceil(totalNotes / limit),
      totalNotes
    });
  } catch (error) {
    next(error);
  }
};

// get single note by id
const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate('user', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // check if note belongs to user or user is admin
    if (note.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this note' });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
};

// update note
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // only owner or admin can update
    if (note.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    next(error);
  }
};

// delete note
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // only owner or admin can delete
    if (note.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
};
