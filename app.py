"""
OrientCI — backend Flask
=========================
Sert le site statique (templates/index.html + static/), enregistre les
évènements de trafic envoyés par script.js dans une base PostgreSQL (Neon),
et expose une page d'administration protégée par mot de passe pour consulter
les statistiques (visites, filières consultées, recherches, bourses cliquées).

Lancement local :
    pip install -r requirements.txt
    python app.py
Le site est alors disponible sur http://127.0.0.1:5000
L'administration est sur http://127.0.0.1:5000/admin (identifiants ci-dessous).

IMPORTANT — SÉCURITÉ :
Les identifiants admin par défaut (admin / orientci2026) sont volontairement
simples pour la démo. Avant toute mise en ligne publique, définis de vraies
valeurs via les variables d'environnement ADMIN_USERNAME, ADMIN_PASSWORD et
SECRET_KEY (voir README.md).
"""

import os
import hashlib
from datetime import datetime, timezone, timedelta
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, redirect, url_for, render_template, g
from sqlalchemy import create_engine, text

# Charger les variables d'environnement depuis .env (si présent)
load_dotenv()

# Base de données PostgreSQL via Neon
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("La variable d'environnement DATABASE_URL n'est pas définie.")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "orientci-dev-secret-change-me")

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "orientci2026")


# ---------------------------------------------------------------------------
# Base de données
# ---------------------------------------------------------------------------

def init_db():
    """Crée la table events si elle n'existe pas."""
    with engine.begin() as conn:
        conn.execute(
            text("""
                CREATE TABLE IF NOT EXISTS events (
                    id SERIAL PRIMARY KEY,
                    type TEXT NOT NULL,
                    label TEXT,
                    value TEXT,
                    path TEXT,
                    ip_hash TEXT,
                    user_agent TEXT,
                    referrer TEXT,
                    created_at TIMESTAMPTZ NOT NULL
                )
            """)
        )


def hash_ip(ip):
    """On ne stocke jamais l'IP en clair : seulement un hash tronqué,
    suffisant pour estimer les visiteurs uniques sans conserver de donnée
    personnelle directement identifiante."""
    if not ip:
        return ""
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Authentification admin (session simple)
# ---------------------------------------------------------------------------

def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("is_admin"):
            return redirect(url_for("admin_login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


# ---------------------------------------------------------------------------
# Routes publiques : site + tracking
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/track", methods=["POST"])
def track():
    data = request.get_json(silent=True) or {}
    event_type = str(data.get("type", "unknown"))[:50]
    label = str(data.get("label", ""))[:200]
    value = str(data.get("value", ""))[:200]
    path = str(data.get("path", ""))[:200]

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO events (type, label, value, path, ip_hash, user_agent, referrer, created_at)
                VALUES (:type, :label, :value, :path, :ip_hash, :user_agent, :referrer, :created_at)
            """),
            {
                "type": event_type,
                "label": label,
                "value": value,
                "path": path,
                "ip_hash": hash_ip(request.remote_addr),
                "user_agent": request.headers.get("User-Agent", "")[:250],
                "referrer": request.headers.get("Referer", "")[:250],
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    return jsonify({"ok": True}), 204


# ---------------------------------------------------------------------------
# Administration
# ---------------------------------------------------------------------------

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["is_admin"] = True
            return redirect(request.args.get("next") or url_for("admin_dashboard"))
        error = "Identifiants incorrects."
    return render_template("admin/login.html", error=error)


@app.route("/admin/logout")
def admin_logout():
    session.pop("is_admin", None)
    return redirect(url_for("admin_login"))


@app.route("/admin")
@login_required
def admin_dashboard():
    return render_template("admin/dashboard.html")


@app.route("/admin/api/stats")
@login_required
def admin_stats():
    today = datetime.now(timezone.utc).date()

    with engine.connect() as conn:
        total_visits = conn.execute(
            text("SELECT COUNT(*) AS c FROM events WHERE type = 'pageview'")
        ).fetchone()["c"]

        visits_today = conn.execute(
            text("SELECT COUNT(*) AS c FROM events WHERE type = 'pageview' AND DATE(created_at) = :today"),
            {"today": today.isoformat()}
        ).fetchone()["c"]

        unique_visitors = conn.execute(
            text("SELECT COUNT(DISTINCT ip_hash) AS c FROM events WHERE type = 'pageview'")
        ).fetchone()["c"]

        # Visites des 14 derniers jours (pour le graphique)
        days = []
        for i in range(13, -1, -1):
            d = (today - timedelta(days=i)).isoformat()
            count = conn.execute(
                text("SELECT COUNT(*) AS c FROM events WHERE type = 'pageview' AND DATE(created_at) = :day"),
                {"day": d}
            ).fetchone()["c"]
            days.append({"date": d, "count": count})

        def top(event_type, limit=8):
            rows = conn.execute(
                text("""
                    SELECT label, COUNT(*) AS c
                    FROM events
                    WHERE type = :event_type AND label != ''
                    GROUP BY label
                    ORDER BY c DESC
                    LIMIT :limit
                """),
                {"event_type": event_type, "limit": limit}
            ).fetchall()
            return [{"label": r["label"], "count": r["c"]} for r in rows]

        recent_rows = conn.execute(
            text("""
                SELECT type, label, value, path, created_at
                FROM events
                ORDER BY id DESC
                LIMIT 30
            """)
        ).fetchall()
        recent = [dict(r._mapping) for r in recent_rows]

    return jsonify({
        "total_visits": total_visits,
        "visits_today": visits_today,
        "unique_visitors": unique_visitors,
        "daily_visits": days,
        "top_schools": top("school_open"),
        "top_official_links": top("official_link_click"),
        "top_searches": top("search"),
        "top_city_filters": top("city_filter"),
        "top_scholarships": top("scholarship_click"),
        "recent_events": recent,
    })


if __name__ == "__main__":
    init_db()
    print("=" * 62)
    print(" OrientCI — serveur de developpement")
    print(" Site public :  http://127.0.0.1:5000")
    print(" Administration : http://127.0.0.1:5000/admin")
    print(f" Identifiants admin par defaut : {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
    print(" -> A CHANGER avant toute mise en ligne (voir README.md)")
    print("=" * 62)
    app.run(debug=True, port=5000)
else:
    # Cas d'un lancement via un serveur WSGI (gunicorn, etc.)
    init_db()