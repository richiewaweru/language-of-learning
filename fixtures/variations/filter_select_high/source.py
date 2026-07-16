def select_high(samples):
    chosen = []
    for sample in samples:
        if sample >= 10:
            chosen.append(sample)
    return chosen
