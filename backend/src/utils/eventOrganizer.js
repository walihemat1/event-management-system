import User from "../models/userModel.js";
import Event from "../models/eventModel.js";

// export const isUserEventOrganizer = async (eventId, currentUser, res) => {
//   try {
//     if (!currentUser)
//       return res.status(401).json({
//         success: false,
//         message: "You are not logged in",
//       });

//     const user = await User.findById(currentUser._id);
//     if (!user)
//       return res.status(401).json({
//         success: false,
//         message: "User not found. Please login again",
//       });

//     const event = await Event.findById(eventId);

//     if (!event)
//       return res.status(404).json({
//         success: false,
//         message: "Event was not found",
//       });

//     // check if the user is event creator
//     if (event.organizerId.toString() !== user._id.toString())
//       return res.status(400).json({
//         success: false,
//         message: "Unauthorized - User is not event organizer",
//       });
//   } catch (error) {
//     console.log("Error in isOrganizer middleware: ", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     });
//   }
// };

export const isUserEventOrganizer = async (eventId, currentUser) => {
  try {
    if (!currentUser) return false;

    const user = await User.findById(currentUser._id);
    if (!user) return false;

    const event = await Event.findById(eventId);
    if (!event) return false;

    return event.organizerId.toString() === user._id.toString();
  } catch (error) {
    console.log("Error in isOrganizer middleware: ", error);
    return false;
  }
};
