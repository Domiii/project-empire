import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';

import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

export const LearnerQuestionTypes = {
  Text: 1,
  YesNo: 2,
  Radios: 3,
  Checkboxes: 4,
  // Date: 5,
  // Time: 6
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
            onWrite: [
              'createdAt',
              'updatedAt'
            ],
            children: {
              title: 'title',
              description: 'description',
              questionType: 'questionType',
              choices: { // if this is a radios/checkboxes question
                path: 'choices', 
                children: {
                  learnerQuestionChoice: {
                    path: '$(choiceId)',
                    children: {
                      title: 'title',
                      description: 'description'
                    }
                  }
                }
              },
              isOptional: 'isOptional',
              order: 'order',
              createdAt: 'createdAt',
              updatedAt: 'updatedAt'
            }
          }
        }
      }
    }
  }
};