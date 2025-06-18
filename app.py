from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///foodbridge.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)    
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'restaurant', 'ngo', 'individual'
    address = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

class FoodListing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    food_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50), nullable=False)
    expiry_time = db.Column(db.DateTime, nullable=False)
    pickup_status = db.Column(db.String(20), default='available')  # available, reserved, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Pickup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    food_listing_id = db.Column(db.Integer, db.ForeignKey('food_listing.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pickup_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.form
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            flash('Email already registered', 'error')
            return redirect(url_for('register'))
        
        hashed_password = generate_password_hash(data['password'], method='scrypt')
        new_user = User(
            email=data['email'],
            password=hashed_password,
            name=data['name'],
            user_type=data['user_type'],
            address=data['address'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            flash('An error occurred. Please try again.', 'error')
            return redirect(url_for('register'))
            
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(email=request.form['email']).first()
        if user and check_password_hash(user.password, request.form['password']):
            login_user(user)
            flash('Logged in successfully!', 'success')
            return redirect(url_for('dashboard'))
        flash('Invalid email or password', 'error')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully!', 'success')
    return redirect(url_for('home'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.user_type == 'restaurant':
        listings = FoodListing.query.filter_by(restaurant_id=current_user.id).all()
        return render_template('restaurant_dashboard.html', listings=listings)
    else:
        listings = FoodListing.query.filter_by(pickup_status='available').all()
        return render_template('recipient_dashboard.html', listings=listings)

@app.route('/create_listing', methods=['POST'])
@login_required
def create_listing():
    if current_user.user_type != 'restaurant':
        flash('Only restaurants can create listings', 'error')
        return redirect(url_for('dashboard'))
    
    try:
        data = request.form
        new_listing = FoodListing(
            restaurant_id=current_user.id,
            food_name=data['food_name'],
            quantity=data['quantity'],
            expiry_time=datetime.strptime(data['expiry_time'], '%Y-%m-%dT%H:%M'),
        )
        db.session.add(new_listing)
        db.session.commit()
        flash('Listing created successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('An error occurred while creating the listing', 'error')
    
    return redirect(url_for('dashboard'))

@app.route('/schedule_pickup', methods=['POST'])
@login_required
def schedule_pickup():
    if current_user.user_type == 'restaurant':
        flash('Restaurants cannot schedule pickups', 'error')
        return redirect(url_for('dashboard'))
    
    try:
        data = request.form
        new_pickup = Pickup(
            food_listing_id=data['listing_id'],
            recipient_id=current_user.id,
            pickup_time=datetime.strptime(data['pickup_time'], '%Y-%m-%dT%H:%M')
        )
        
        listing = FoodListing.query.get(data['listing_id'])
        if listing:
            listing.pickup_status = 'reserved'
            db.session.add(new_pickup)
            db.session.commit()
            flash('Pickup scheduled successfully!', 'success')
        else:
            flash('Listing not found', 'error')
    except Exception as e:
        db.session.rollback()
        flash('An error occurred while scheduling the pickup', 'error')
    
    return redirect(url_for('dashboard'))

@app.route('/api/listings')
def get_listings():
    listings = FoodListing.query.filter_by(pickup_status='available').all()
    return jsonify([{
        'id': l.id,
        'food_name': l.food_name,
        'quantity': l.quantity,
        'expiry_time': l.expiry_time.isoformat(),
        'pickup_status': l.pickup_status
    } for l in listings])

def init_db():
    with app.app_context():
        # Create all database tables
        db.create_all()
        print("Database initialized successfully!")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8080, debug=True) 