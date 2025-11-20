import Feedback from "../models/feedbackModel.js";

export const addFeedback = async (req, res) => {
  const { eventId, userId, rating, comment } = req.body;

  if (!eventId || !userId || !rating || !comment)
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });

  try {
    const feedback = await Feedback.create(req.body);
    res.status(201).json({
      success: true,
      message: "Feedback was added successfully",
      data: feedback,
    });
  } catch (error) {
    console.log("Error in addFeedback controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json({
      success: true,
      message: "All feedbacks",
      data: feedbacks,
    });
  } catch (error) {
    console.log("Error in getAllFeedbacks controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getSpecificEventAllFeedbacks = async (req, res) => {
  if (!req?.params?.eventId)
    res.status(400).json({
      success: false,
      message: "Event ID is required",
    });

  const { eventId } = req.params;

  try {
    const feedbacks = await Feedback.find({ eventId });
    res.status(200).json({
      success: true,
      message: `All feedbacks for Event ${eventId}`,
      data: feedbacks,
    });
  } catch (error) {
    console.log("Error in getSpecificEventAllFeedbacks controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getSingleFeedback = async (req, res) => {
  if (!req.params?.feedbackId)
    return res.status(400).json({
      success: false,
      message: "Feedback ID is required",
    });

  try {
    const feedback = await Feedback.findById(req.params.feedbackId);
    if (!feedback)
      return res.status(404).json({
        success: false,
        message: "feedback was not found",
      });

    res.status(200).json({
      success: true,
      message: "Single feedback",
      data: feedback,
    });
  } catch (error) {
    console.log("Error in getAllFeedbacks controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const updateFeedback = async (req, res) => {
  if (!req.params?.feedbackId)
    return res.status(400).json({
      success: false,
      message: "Feedback ID is required",
    });

  const { feedbackId } = req.params;

  try {
    // find the feedback to be updated and see if it exits in DB
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback)
      return res.status(404).json({
        success: false,
        message: "Feedback was not found!",
      });

    // check if useris feedback provider
    if (feedback.userId.toString() !== req.user._id.toString())
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User is not feedback provider",
      });

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      req.body,
      { new: true }
    );

    if (!updatedFeedback)
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Try again!",
      });

    res.status(200).json({
      success: true,
      message: "Feedback was updated successfully",
      data: updatedFeedback,
    });
  } catch (error) {
    console.log("Error in updateFeedback controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const deleteFeedback = async (req, res) => {
  if (!req.params?.feedbackId)
    return res.status(400).json({
      success: false,
      message: "Feedback ID is required",
    });

  const { feedbackId } = req.params;

  try {
    // find the feedback to be deleted and see if it exits in DB
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback)
      return res.status(404).json({
        success: false,
        message: "Feedback was not found!",
      });

    // check if useris feedback provider
    if (feedback.userId.toString() !== req.user._id.toString())
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User is not feedback provider",
      });

    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!deletedFeedback)
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Try again!",
      });

    res.status(200).json({
      success: true,
      message: "Feedback was deleted successfully",
      data: deletedFeedback,
    });
  } catch (error) {
    console.log("Error in deleteFeedback controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
