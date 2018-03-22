import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well,
  Panel
} from 'react-bootstrap';

import GoalForm from 'src/views/components/goals/GoalForm';
import {
  CycleStatusListOfUser
} from 'src/views/components/scaffolding/CycleStatusList';

//import LearnerStatusList from 'src/views/components/scaffolding/LearnerStatusList';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';

import { LoadOverlay } from 'src/views/components/overlays';



@dataBind()
export default class HomePage extends Component {
  static propTypes = {

  };

  constructor(...args) {
    super(...args);
  }

  render(
    { },
    { },
    { currentUid, currentUid_isLoaded,
      currentLearnerScheduleId, currentLearnerScheduleId_isLoaded,
      currentScheduleCycleName, currentScheduleCycleName_isLoaded,
      currentLearnerScheduleCycleId, currentLearnerScheduleCycleId_isLoaded
    }
  ) {
    if (!currentUid_isLoaded | 
      !currentScheduleCycleName_isLoaded |
      !currentLearnerScheduleCycleId_isLoaded) {
      return (<LoadOverlay />);
    }

    let lateReflections;
    const scheduleId = currentLearnerScheduleId;
    const cycleId = currentLearnerScheduleCycleId;
    const uid = currentUid;
    const goalFormArgs1 = {
      scheduleId, cycleId, uid
    };
    const goalFormArgs2 = cycleId > 1 && {
      scheduleId, cycleId: cycleId-1, uid
    };

    return (
      <div>
        {/* <Panel bsStyle="primary">
          <Panel.Heading>
            我們的學習環境
          </Panel.Heading>
          <Panel.Body>
            <Well className="no-margin">
            TODO: 本 {currentScheduleCycleName} 的學生主持人： ...
            TODO: 本 {currentScheduleCycleName} 分享狀態
            </Well>
          </Panel.Body>
        </Panel> */}

        {lateReflections && (
          <Panel bsStyle="danger">
            <Panel.Heading>
              緊急的事
            </Panel.Heading>
            <Panel.Body>
              TODO: 已經過的 cycle，而且還沒填好的反思調查清淡～
              <div>
                  TODO: 請更新你之前還沒更新的分享狀態
              </div>
            </Panel.Body>
          </Panel>
        ) || ''}

        <CycleStatusListOfUser />


        {/* <div>
          The main and core concept:
            * Take your own learning journey into your own hand.
            * Allows us (and hopefully soon peers) to bring every week's MVPs onto the stage.
              * Multiple categories, including:
                * great outcome
                * great improvement
                * 心得 + reflection
                * 共學王?
                * 幫別人幫很多?
            * TODO: Core skills
              * TODO: Tactical decision making + metacognition
              * TODO: Problem solving process
              * TODO: More cognition + thinking
            * TODO: Co-learning support
              * Goal: 每個禮拜要有怪事發生
              * Goal: 學生主持／管理整個活動
              * Goal: Overcome initial anxiety + remember names faster/sooner
              * Cross-pollination
                * Random teams?
                * Random (disruptive) events?
                * Vote on these?!
                * Goal: It should be easy to opt in and out of, but hard to ignore these events! (make them be strategic!)
              * TODO: Identify + support "co-learner roles", e.g.
                * leaders, hosts, organizers
                * communicators, networkers, carries etc.
              * TODO: Learning path + concepts pub-sub system for co-learning time
                * Exploring "concepts" (currently)
                * Pitching and working on common "goals"
            * Mentors/Coaches: 
              * (relatively) quickly get to know the cohort
              * give feedback
              * affirm + motivate
              * customized guiding questions
              * check on commitment
              * action recommendations
            * TODO: Analysis
              * meta-affect, efficacy, productivity + progress and stagnation?
              * identify those who have not been convinced yet
              * identify those who need more help
              * Define affect (caring) as a core metric of successful learning?
                * everything else is allowed to go up and down over time (but ideally of course, still up for the most part)
            * TODO: 後續？
          * Basic commitment of (opt in) students every week:
            * set goals
            * reflect on your own goals
            * check others' feedback -> reply / bounce back / archive
          
        </div> */}

        {/* <div>
          TODO: Reflection
        </div> */}

        {/* <div>
          (Action) Recommendation + Reaction
          (Commitment Inquiry + Reaction?)
        </div> */}
      </div>
    );
  }
}