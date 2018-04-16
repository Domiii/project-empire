// ##########################################################################
// MissionSelect component to select missions
// ##########################################################################

const MissionSelect = dataBind({
  missionOptions(
    { },
    { lookupLocalized },
    { missionList }
  ) {
    return missionList && map(missionList, (mission, missionId) => ({
      value: missionId,
      label: lookupLocalized({ obj: mission, prop: 'title' })
    }));
  },
  onChangeOption(option, { onChange }, { }, { missionList }) {
    let missionId = option && option.value;
    if (!missionList[missionId]) {
      missionId = null;
    }
    onChange(missionId);
  }
})((
  { value },
  { onChangeOption, missionOptions },
  { missionList_isLoaded }
) => {
  if (!missionList_isLoaded) {
    return <LoadIndicator block message="loading missions..." />;
  }

  const options = missionOptions();
  return (<Select
    value={value}
    placeholder="select mission"
    options={options}
    onChange={onChangeOption}
  />);
});

export default MissionSelect;