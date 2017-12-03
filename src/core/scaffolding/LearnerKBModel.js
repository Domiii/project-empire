import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';

import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

export const LearnerQuestionTypes = {
  ShortAnswer: 1,
  ParagraphAnswer: 2,
  Radios: 3,
  Checkboxes: 4,
  Date: 5,
  Time: 6
};

const readers = {
};

const writers = {

};

export default {
  learnerKb: {
    path: 'learnerKb',
    children: {
      learnerTagList: {
        path: 'tagList',
        children: {
          learnerTag: {
            path: '$(learnerTagId)',
            children: {
              name: 'name',
              icon: 'icon',
              description: 'description'
            }
          }
        }
      },
      learnerQuestionList: {
        path: 'questionList',
        children: {
          learnerQuestion: {
            path: '$(questionId)',
            children: {
              title: 'title',
              description: 'description',
              questionType: 'questionType',
              choices: 'choices', // if this is a radios/checkboxes question
              order: 'order'
            }
          }
        }
      }
    }
  }
};