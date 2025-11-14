const toNull = <T>(value: T | null | undefined | string): T | null => {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    value === ' ' ||
    (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
  ) {
    return null;
  }

  return value;
};

export default toNull;
