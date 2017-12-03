/*
  * 
    * [Emotions](https://simple.wikipedia.org/wiki/List_of_emotions)
    * Actions:
      * "Don't care"
      * "Not related to me"
      * "Don't understand" (w/ comment)
      * "Parts are unclear" (w/ comment)
      * "Make promise" -> list of `PromiseReactionTemplate`, e.g.:
        * Will do!
        * Will try
      * Acknowledged
 */

export const FeedbackReactionType = {
  Acknowledged: 1, //  (but won't do anything with it)
  MakePromise: 2,
  DontCare: 3,
  NotRelatedToMe: 4,
  DontUnderstand: 5,
  PartUnclear: 6
};