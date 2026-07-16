def tally_negatives(entries):
    negatives = 0
    for entry in entries:
        if entry < 0:
            negatives = negatives + 1
    return negatives
