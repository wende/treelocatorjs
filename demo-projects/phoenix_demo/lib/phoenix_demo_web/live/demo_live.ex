defmodule PhoenixDemoWeb.DemoLive do
  use PhoenixDemoWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0, message: "Hello from Phoenix LiveView!")}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="container mx-auto p-8">
      <h1 class="text-4xl font-bold mb-4">Phoenix LiveView Demo</h1>

      <div class="mb-8">
        <p class="text-xl mb-4"><%= @message %></p>
        <p class="text-2xl mb-4">Count: <span class="font-bold"><%= @count %></span></p>

        <div class="space-x-4">
          <button
            phx-click="increment"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Increment
          </button>
          <button
            phx-click="decrement"
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Decrement
          </button>
          <button
            phx-click="reset"
            class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
        </div>
      </div>

      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p class="font-bold">Real-time Counter Demo</p>
        <p>This demonstrates Phoenix LiveView's real-time capabilities without writing JavaScript!</p>
      </div>
    </div>
    """
  end

  @impl true
  def handle_event("increment", _params, socket) do
    {:noreply, update(socket, :count, &(&1 + 1))}
  end

  @impl true
  def handle_event("decrement", _params, socket) do
    {:noreply, update(socket, :count, &(&1 - 1))}
  end

  @impl true
  def handle_event("reset", _params, socket) do
    {:noreply, assign(socket, count: 0)}
  end
end
