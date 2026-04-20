<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stoks', function (Blueprint $table) {
            $table->id('id_stok');
            $table->foreignId('id_barang')->constrained('barangs', 'id_barang', 'id_barang')->onDelete('cascade');
            $table->string('nomor_lot', 50);
            $table->integer('jumlah');
            $table->date('tanggal_transaksi');
            $table->enum('jenis_transaksi', ['masuk', 'keluar']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stoks');
    }
};
