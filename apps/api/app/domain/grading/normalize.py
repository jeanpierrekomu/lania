"""Normalización de respuestas para comparar sin castigar diferencias irrelevantes (ADR-004).

No evaluamos mayúsculas ni puntuación en `grammar_closed_v1`; las contracciones seguras se
expanden para que «doesn't drink» y «does not drink» sean la misma respuesta. También se descartan
caracteres invisibles y emojis, y las horas se escriben de una sola forma («9am», «9:00 a.m.» → «9 am»).
"""

import re
import unicodedata

_APOSTROPHES = str.maketrans({"’": "'", "‘": "'", "`": "'", "´": "'", "ʼ": "'"})
_QUOTES = str.maketrans({"“": " ", "”": " ", '"': " ", "«": " ", "»": " "})
# Invisibles que pegan los teclados móviles o el portapapeles (zero-width, BOM, selector de emoji, guion suave).
_INVISIBLE = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff\ufe0e\ufe0f\u00ad"), None)
# Horas: 9am, 9 am, 9 a.m., 9:00 a.m., 9.00 am → «9 am»; 9:30 pm → «9 30 pm».
_TIME = re.compile(r"(?<![\d.:])(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s?m(?![a-z])\.?")

# Solo contracciones sin ambigüedad. 's (is/has/posesivo) y 'd (would/had) NO se expanden.
_IRREGULAR_CONTRACTIONS = {
    "won't": "will not",
    "can't": "can not",
    "cannot": "can not",
    "shan't": "shall not",
    "ain't": "am not",
}
_SUFFIX_CONTRACTIONS = (
    ("n't", " not"),
    ("'re", " are"),
    ("'ll", " will"),
    ("'ve", " have"),
)
_PUNCTUATION = re.compile(r"[.,!?;:¿¡()\[\]{}…]")
_SPACES = re.compile(r"\s+")


_BARE_CONTRACTIONS = {"'ll": "will", "'m": "am", "'re": "are", "'ve": "have"}


def _expand_token(token: str) -> str:
    if token in _BARE_CONTRACTIONS:  # «'ll work» escrito sin sujeto en un hueco
        return _BARE_CONTRACTIONS[token]
    token = token.strip("'")  # comillas simples usadas como comillas
    if token in _IRREGULAR_CONTRACTIONS:
        return _IRREGULAR_CONTRACTIONS[token]
    if token == "i'm":
        return "i am"
    for suffix, replacement in _SUFFIX_CONTRACTIONS:
        if token.endswith(suffix) and len(token) > len(suffix):
            return token[: -len(suffix)] + replacement
    return token


def _time(match: re.Match[str]) -> str:
    hour, minutes, half = match.group(1), match.group(2), match.group(3)
    return f"{hour} {minutes} {half}m" if minutes and minutes != "00" else f"{hour} {half}m"


def _drop_symbols(value: str) -> str:
    """Emojis y otros símbolos (categoría Unicode S*) no forman parte de la respuesta lingüística."""
    return "".join(" " if unicodedata.category(ch).startswith("S") else ch for ch in value)


def normalize(text: str) -> str:
    """Devuelve una forma canónica: minúsculas, sin puntuación, contracciones expandidas."""
    # Apóstrofos ANTES de NFKC: NFKC convierte «´» (teclado español) en espacio + acento combinante.
    value = unicodedata.normalize("NFKC", text.translate(_APOSTROPHES))
    value = value.translate(_APOSTROPHES).translate(_QUOTES).translate(_INVISIBLE)
    value = _drop_symbols(value.lower())
    value = _TIME.sub(_time, value)
    value = value.replace("a.m.", "am").replace("p.m.", "pm")
    value = _PUNCTUATION.sub(" ", value)
    value = value.replace("-", " ").replace("_", " ")
    tokens = [_expand_token(t) for t in _SPACES.split(value.strip()) if t.strip("'")]
    return _SPACES.sub(" ", " ".join(tokens)).strip()


# Contracciones escritas sin apóstrofo o con el apóstrofo desplazado: dont, doesnt, does'nt, wont…
_NT_STEMS = frozenset(
    {"do", "does", "did", "is", "are", "was", "were", "have", "has", "had", "could", "should", "would", "must", "need"}
)
_NT_IRREGULAR = {"wont": "will not", "wo'nt": "will not", "cant": "can not", "ca'nt": "can not"}


def _repair_token(token: str) -> str | None:
    if token in _NT_IRREGULAR:
        return _NT_IRREGULAR[token]
    for marker in ("'nt", "nt"):
        if token.endswith(marker) and token[: -len(marker)] in _NT_STEMS:
            return token[: -len(marker)] + " not"
    return None


def repair_contractions(normalized: str) -> str | None:
    """Repara contracciones sin apóstrofo en un texto YA normalizado; None si no había nada que reparar.

    No forma parte de `normalize()` porque omitir el apóstrofo es un error de escritura que el
    corrector señala (`spelling.apostrophe`), no una diferencia irrelevante.
    """
    tokens = normalized.split()
    repaired = [_repair_token(t) or t for t in tokens]
    return " ".join(repaired) if repaired != tokens else None


def osa_distance(a: str, b: str) -> int:
    """Distancia de edición con transposiciones adyacentes (Damerau restringida)."""
    rows, cols = len(a) + 1, len(b) + 1
    d = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        d[i][0] = i
    for j in range(cols):
        d[0][j] = j
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[-1][-1]
