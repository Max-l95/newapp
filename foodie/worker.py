from apscheduler.schedulers.background import BackgroundScheduler
from app import app  # Make sure to import your Flask app
from app import invio_asincrono  # Adjust this to your task function

scheduler = BackgroundScheduler()

def scheduled_task():
    with app.app_context():
        invio_asincrono()

# Schedule the task for a specific time
scheduler.add_job(scheduled_task, 'cron', minute=0)  # Modify as needed
scheduler.start()

# Keep the worker alive
if __name__ == '__main__':
    try:
        # Prevent the worker from exiting
        while True:
            pass
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()  # Ensure the scheduler shuts down cleanly
