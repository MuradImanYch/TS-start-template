export default function toNull(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }
    return value;
}
