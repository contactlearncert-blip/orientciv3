"""
OrientCI — backend Flask (Version définitive – corrige l'erreur de connexion fermée)
"""

import os
import hashlib
import traceback
from datetime import datetime, timezone, timedelta
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, redirect, url_for, render_template, g
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "orientci-dev-secret-change-me")

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "orientci2026")

_db_engine = None
_db_ready = False


# ---------------------------------------------------------------------------
# Gestion de la base (lazy)
# ---------------------------------------------------------------------------

def get_engine():
    global _db_engine
    if _db_engine is None:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL non définie")
        _db_engine = create_engine(
            database_url,
            pool_pre_ping=True,
            future=True
        )
    return _db_engine


def init_db():
    engine = get_engine()
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


def ensure_db_ready():
    global _db_ready
    if _db_ready:
        return True
    try:
        init_db()
        _db_ready = True
        print("✅ Base PostgreSQL connectée")
        return True
    except Exception as e:
        print(f"❌ Erreur init DB : {e}")
        traceback.print_exc()
        _db_ready = False
        return False


@app.before_request
def before_request():
    ensure_db_ready()


# ---------------------------------------------------------------------------
# Utilitaires
# ---------------------------------------------------------------------------

def hash_ip(ip):
    if not ip:
        return ""
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]


def require_db(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not ensure_db_ready():
            return jsonify({"error": "Base de données indisponible"}), 503
        try:
            return f(*args, **kwargs)
        except SQLAlchemyError as e:
            print(f"❌ SQLAlchemyError dans {f.__name__}: {e}")
            traceback.print_exc()
            return jsonify({"error": f"Erreur base de données : {str(e)}"}), 500
        except Exception as e:
            print(f"❌ Exception inattendue dans {f.__name__}: {e}")
            traceback.print_exc()
            return jsonify({"error": f"Erreur interne : {str(e)}"}), 500
    return wrapped


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("is_admin"):
            return redirect(url_for("admin_login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


# ---------------------------------------------------------------------------
# ROUTES DE DIAGNOSTIC
# ---------------------------------------------------------------------------

@app.route("/api/health")
def health():
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).fetchone()
        return jsonify({
            "status": "ok",
            "database": "connected",
            "test_query": result[0] if result else None
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "type": type(e).__name__
        }), 500


@app.route("/debug")
def debug():
    db_url = os.environ.get("DATABASE_URL", "ABSENTE")
    if db_url and ":" in db_url:
        parts = db_url.split("@")
        if len(parts) == 2:
            db_url = parts[0][:20] + "...@" + parts[1]
    return jsonify({
        "python_version": __import__('sys').version,
        "cwd": os.getcwd(),
        "database_url_defined": bool(os.environ.get("DATABASE_URL")),
        "database_url_preview": db_url,
        "sqlalchemy_version": __import__('sqlalchemy').__version__,
        "db_ready": _db_ready,
        "admin_username": ADMIN_USERNAME,
    })


# ---------------------------------------------------------------------------
# ROUTES PRINCIPALES
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/track", methods=["POST"])
@require_db
def track():
    data = request.get_json(silent=True) or {}
    event_type = str(data.get("type", "unknown"))[:50]
    label = str(data.get("label", ""))[:200]
    value = str(data.get("value", ""))[:200]
    path = str(data.get("path", ""))[:200]

    engine = get_engine()
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
@require_db
def admin_stats():
    today = datetime.now(timezone.utc).date()
    engine = get_engine()

    # Utilisation de engine.begin() pour garantir une transaction active
    # et éviter la fermeture prématurée de la connexion
    with engine.begin() as conn:
        # Total des visites
        total_visits = conn.execute(
            text("SELECT COUNT(*) AS c FROM events WHERE type = 'pageview'")
        ).scalar()

        # Visites du jour
        visits_today = conn.execute(
            text("SELECT COUNT(*) AS c FROM events WHERE type = 'pageview' AND DATE(created_at) = :today"),
            {"today": today.isoformat()}
        ).scalar()

        # Visiteurs uniques
        unique_visitors = conn.execute(
            text("SELECT COUNT(DISTINCT ip_hash) AS c FROM events WHERE type = 'pageview'")
        ).scalar()

        # 14 derniers jours
        days = []
        for i in range(13, -1, -1):
            d = (today - timedelta(days=i)).isoformat()
            count = conn.execute(
                text("SELECT COUNT(*) AS c FROM events WHERE type = 'pageview' AND DATE(created_at) = :day"),
                {"day": d}
            ).scalar()
            days.append({"date": d, "count": count})

        # Top écoles
        rows = conn.execute(
            text("""
                SELECT label, COUNT(*) AS c
                FROM events
                WHERE type = 'school_open' AND label != ''
                GROUP BY label
                ORDER BY c DESC
                LIMIT 8
            """)
        ).fetchall()
        top_schools = [{"label": r[0], "count": r[1]} for r in rows]

        # Top liens officiels
        rows = conn.execute(
            text("""
                SELECT label, COUNT(*) AS c
                FROM events
                WHERE type = 'official_link_click' AND label != ''
                GROUP BY label
                ORDER BY c DESC
                LIMIT 8
            """)
        ).fetchall()
        top_official_links = [{"label": r[0], "count": r[1]} for r in rows]

        # Top recherches
        rows = conn.execute(
            text("""
                SELECT label, COUNT(*) AS c
                FROM events
                WHERE type = 'search' AND label != ''
                GROUP BY label
                ORDER BY c DESC
                LIMIT 8
            """)
        ).fetchall()
        top_searches = [{"label": r[0], "count": r[1]} for r in rows]

        # Top filtres ville
        rows = conn.execute(
            text("""
                SELECT label, COUNT(*) AS c
                FROM events
                WHERE type = 'city_filter' AND label != ''
                GROUP BY label
                ORDER BY c DESC
                LIMIT 8
            """)
        ).fetchall()
        top_city_filters = [{"label": r[0], "count": r[1]} for r in rows]

        # Top bourses cliquées
        rows = conn.execute(
            text("""
                SELECT label, COUNT(*) AS c
                FROM events
                WHERE type = 'scholarship_click' AND label != ''
                GROUP BY label
                ORDER BY c DESC
                LIMIT 8
            """)
        ).fetchall()
        top_scholarships = [{"label": r[0], "count": r[1]} for r in rows]

        # Événements récents
        rows = conn.execute(
            text("""
                SELECT type, label, value, path, created_at
                FROM events
                ORDER BY id DESC
                LIMIT 30
            """)
        ).fetchall()
        recent = [{"type": r[0], "label": r[1], "value": r[2], "path": r[3], "created_at": r[4]} for r in rows]

    return jsonify({
        "total_visits": total_visits,
        "visits_today": visits_today,
        "unique_visitors": unique_visitors,
        "daily_visits": days,
        "top_schools": top_schools,
        "top_official_links": top_official_links,
        "top_searches": top_searches,
        "top_city_filters": top_city_filters,
        "top_scholarships": top_scholarships,
        "recent_events": recent,
    })


# ---------------------------------------------------------------------------
# Lancement
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    ensure_db_ready()
    print("=" * 62)
    print(" OrientCI — serveur de developpement")
    print(" Site public :  http://127.0.0.1:5000")
    print(" Administration : http://127.0.0.1:5000/admin")
    print(f" Identifiants admin : {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
    print("=" * 62)
    app.run(debug=True, port=5000)