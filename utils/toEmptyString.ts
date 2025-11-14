const toEmptyString = (value: string | null | undefined): string => {
  if (value === null || value === '' || value === ' ' || value === undefined) {
    return '';
  }
  return value;
};

export default toEmptyString;