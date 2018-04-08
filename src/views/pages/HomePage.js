import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well,
  Panel
} from 'react-bootstrap';


import UserCycleStatusList from 'src/views/components/scaffolding/UserCycleStatusList';

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
    { }
  ) {
    let lateReflections;

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

        <UserCycleStatusList />


        {/* <div>
          系統 v0.1
          * submit your stuff
            * help us to keep track of your stuff
            * help yourself keep track of your stuff
          * keep track of changes/notifications
          * show changes/notifications in backend, so coaches can make use of it
          * gain feedback

          The main and core concepts:
            * Goal: Take your own learning journey into your own hand.
            * Feature: Goal Exploration + Setting
            * Feature: Explore + take actions (list/map of (repeatable) mini activities)
              * But beware of too many choices - it can lead to decision-making paralysis! [Barry Schwartz; The Paradox of Choice]
            * More Ideas
              * Try to take it one component at a time
              * Paradigm: Breadth-first exploration; make sure you are on solid footing on all the impprtant variables, and don't dwell too deeply into one?
                * Inspiration source: Sim City talk @ GDC 2018
                * (it still implies making progress all the time; just going not letting any dimension alone for too long!)
              * Paradigm: Do the minimal amount of work to solve the problem at hand
              * Work only/mostly on a single component each week.
            * Basic actions / commitment of (opting in) students every week:
              * set goals
              * reflect on your own goals
              * check others' feedback -> reply / reject? / archive
            * TODO: Figure out how they can learn to make sense of, set and act on goals!!!
              * "TODO item" vs. goal?!
              * single goal or multiple goals per week? (focus? problem decomposition?)
              * exploration vs. pursuing goals vs. seeking/exploring opportunities?
              * alone vs. together/collaborative?
              * allocating time devoted to "trying to do the right thing"?
                * matching energy levels against allocated time + actions?
            * Mentors/Coaches: 
              * (relatively quickly) get to know the cohort
                (* name + pic?)
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
            * TODO: 後續？
          
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