// GraphQL query/mutation strings for worksheet persistence.
// Import these with an Apollo Client instance when backend integration is needed.

export const SAVE_WORKSHEET_MUTATION = `
  mutation SaveWorksheet($input: SaveWorksheetInput!) {
    saveWorksheet(input: $input) {
      id
      title
      structure
      created_at
      updated_at
      content {
        items {
          id
          type
          data {
            ... on WorksheetText { text }
            ... on WorksheetMultipleChoice {
              question
              answers { correct text }
            }
            ... on WorksheetFillInTheBlanks { text }
            ... on WorksheetFreetext { task }
          }
        }
      }
    }
  }
`;

export const GET_WORKSHEET_QUERY = `
  query GetWorksheet($worksheetId: ID!) {
    getWorksheet(worksheetId: $worksheetId) {
      id
      title
      structure
      created_at
      updated_at
      content {
        items {
          id
          type
          data {
            ... on WorksheetText { text }
            ... on WorksheetMultipleChoice {
              question
              answers { correct text }
            }
            ... on WorksheetFillInTheBlanks { text }
            ... on WorksheetFreetext { task }
          }
        }
      }
    }
  }
`;

export const GENERATE_AI_CONTENT_MUTATION = `
  mutation GenerateAIContent($input: GenerateAIContentInput!) {
    generateAIContent(input: $input) {
      text
      html
      question
      answers { correct text }
      task
    }
  }
`;
