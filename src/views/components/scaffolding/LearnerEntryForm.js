
const LearnerEntryForm = dataBind({})(function LearnerEntryList(
  { uid, scheduleId, cycleId },
  { userPublic, 
    get_learnerEntryStatus }
) {
  const learnerEntryId = { uid, scheduleId, cycleId };
  if (!userPublic.isLoaded({ uid }) |
    !get_learnerEntryStatus.isLoaded({ learnerEntryId })) {
    return <LoadIndicator />;
  }
  else {
    const status = get_learnerEntryStatus({ learnerEntryId });
    const user = userPublic({ uid });
    if (!status || !user) {
      // TODO
      return <Redirect />;
    }

    // TODO
    return '';
  }
});

export default LearnerEntryForm;