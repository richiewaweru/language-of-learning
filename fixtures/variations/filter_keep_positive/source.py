def keep_positive(readings):
    kept = []
    for reading in readings:
        if reading > 0:
            kept.append(reading)
    return kept
