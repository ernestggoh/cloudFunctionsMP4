const functions = require("firebase-functions");
const capitalizeSentence = require("capitalize-sentence");
const Filter = require("bad-words");
const badWordsFilter = new Filter();

// Moderates messages
exports.moderator = functions.firestore.document("/comments/{commentId}")
    .onWrite((change) => {
      functions.logger.log("Main function ran, updated 11:36");
      const comment = change.after.data();
      const message = comment.commentContent;

      if (message) {
        // Retrieved the message values.
        functions.logger.log("Retrieved message content: ", message);

        // Run moderation checks on on the message and moderate if needed.
        const moderatedMessage = moderateMessage(message);

        // Update the Firebase DB with checked message.
        functions.logger.log(
            "Message has been moderated. Saving to DB: ",
            moderatedMessage
        );
        return change.after.ref.update({
          commentContent: moderatedMessage,
        });
      }
      return null;
    });

/**
 * Moderates the given message
 * @param {string} message Message
 * @return {string} The edited message.
 */
function moderateMessage(message) {
  // Re-capitalize if the user is Shouting.
  if (isShouting(message)) {
    functions.logger.log("User is shouting. Fixing sentence case...");
    message = stopShouting(message);
  }

  // Moderate if the user uses SwearWords.
  if (containsSwearwords(message)) {
    functions.logger.log("User is swearing. moderating...");
    message = moderateSwearwords(message);
  }

  return message;
}

/**
 * Detect if the current message has swearwords
 * @param {string} message Message
 * @return {boolean} if the current message has swearwords
 */
function containsSwearwords(message) {
  return message !== badWordsFilter.clean(message);
}

/**
 * Moderates swear words
 * @param {string} message Message
 * @return {string} The edited message.
 */
function moderateSwearwords(message) {
  return badWordsFilter.clean(message);
}

/**
 * Detect if the current message is shouting.
 * @param {string} message Message
 * @return {boolean} if the current message is shouting.
 */
function isShouting(message) {
  return message.replace(/[^A-Z]/g, "").length > message.length / 2 ||
  message.replace(/[^!]/g, "").length >= 3;
}

/**
 * Correctly capitalize the string as a sentence (e.g. uppercase after dots)
 * and remove exclamation points.
 * @param {string} message Message
 * @return {string} The edited message.
 */
function stopShouting(message) {
  return capitalizeSentence(message.toLowerCase()).replace(/!+/g, ".");
}

