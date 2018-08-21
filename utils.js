

const partition = (arr = [], predicate = () => true) =>
  arr.reduce(
    (partitions, element) => {
      partitions[predicate(element) ? 0 : 1].push(element);
      return partitions;
    },
    [[], []]
  );

exports.partition = partition;