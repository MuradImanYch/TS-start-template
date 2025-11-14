const toEmptyString = (value) => {
    if (value === null || value === '' || value === ' ' || value === undefined) {
        return '';
    }
    return value;
};
export default toEmptyString;
