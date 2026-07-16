def count_big(values):
    hits = 0
    for value in values:
        if value > 5:
            hits = hits + 1
    return hits
