export const formatOversCompleted = (o: string) => {
    const [over, ball] = o.split('.').map(Number);
    if (ball === 6) {
        return `${over + 1}.0`
    }
    return o;
};