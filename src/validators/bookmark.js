export const linkConstraints = {
  presence: true,
  format: {
    pattern: /^(https:\/\/|http:\/\/).+\..+$/,
    flags: 'i',
    // message: 'BOOKMARKS_INVALID_LINK'
    }
}