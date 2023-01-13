<template>
  <q-card class="moyennelargeur fs-md">
    <q-toolbar class="bg-secondary text-white">
      <bouton-help page="page1"/>
      <q-toolbar-title class="titre-lg q-pl-sm">{{$t('GBtit')}}</q-toolbar-title>
      <q-btn dense size="md" color="warning" icon="close" @click="ui.gestionBases = false"/>
    </q-toolbar>

    <div v-if="session.ok" class="q-px-sm q-mt-md titre-md text-italic text-warning">{{$t('GBnc')}}</div>

    <div v-if="!session.ok" class="q-px-sm q-mt-md q-px-sm">
      <div v-if="!nbbases" class="titre-lg text-italic">{{$t('GBnb')}}</div>
      <div v-else>
        <div class="titre-md text-italic text-warning">{{$t('GBcl')}}</div>
        <div v-for="it in bases" :key="it.nb" class="zone items-center fs-md cursor-pointer zone"
          @click="itdel=it;suppbase=true">
          <div class="fs-md q-mt-sm">{{it.nb}}</div>
          <div class="q-pl-md q-mb-sm row items.center">
            <div class="col-3">{{it.reseau}}</div>
            <div class="col-2">{{it.trig}}</div>
            <div :class="'col-1 font-mono' + (it.dpbh.length!==1 ? ' text-warning bg-yellow-5':'')">{{it.dpbh.length}}</div>
            <div v-if="it.v1" class="col-2 font-mono">{{edvol(it.v1 + it.v2)}}</div>
            <div v-if="it.v1" class="col-4 font-mono">(fichiers: {{edvol(it.v2)}})</div>
            <q-btn v-if="it.v1===0 && !running" class="col-6" @click.stop="getVU(it.nb)"
              size="md" dense color="primary" no-caps label="Volume de la base"/>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="running">
      <q-card>
        <div class="column items-center">
          <q-spinner-hourglass persistent color="primary" size="3rem" @click="running=false"/>
          <div class="fs-md font-mono q-mt-md">{{session.volumeTable}}</div>
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="suppbase">
      <q-card>
        <q-card-section>
          <div class="titre-lg">Réseau: {{itdel.reseau}}</div>
          <div class="titre-lg">Propriétaire: {{itdel.trig}}</div>
          <div class="fs-sm font-mono">Nom de la base: {{itdel.nb}}</div>
          <div v-if="!itdel.dpbh.length" class="titre-md text-bold bg-yellow-5 text-negative">
            Cette base ne peut PLUS être accédée : elle peut être supprimée sans risque
          </div>
          <div v-if="itdel.dpbh.length > 1" class="titre-md text-bold text-warning">
            Cette base peut être accédée par 2 phrases secrètes, probablement la dernière et une ancienne.
          </div>
        </q-card-section>
        <q-card-actions>
          <q-btn dense label="Je conserve la base" color="primary" v-close-popup/>
          <q-btn dense label="Je supprime la base" icon="delete" color="warning"
            @click="deleteIDB(itdel.nb)" v-close-popup/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>

<script>
import { ref } from 'vue'
import Dexie from 'dexie'
import { encode, decode } from '@msgpack/msgpack'
import { sleep, edvol, afficherDiag, b64ToU8, u8ToB64 } from '../app/util.mjs'
import stores from '../stores/stores.mjs'
import { vuIDB } from '../app/db.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'

export default ({
  name: 'GestionBases',
  components: { BoutonHelp },
  data () {
    return {
      suppbase: false,
      itdel: null,
      edvol: edvol,
      running: false
    }
  },

  methods: {
    async getVU (nb) {
      this.running = true
      try {
        const [v1, v2] = await vuIDB(nb)
        const it = this.bases[nb]
        it.v1 = v1
        it.v2 = v2
      } catch (e) {
        afficherDiag(e.message)
      }
      this.running = false
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui

    const bases = {}
    const nbbases = ref(0)

    function getBases () {
      // trigs[nombase] = [reseau, trig]
      // localStore : key: reseau-dpbh val = nombase
      nbbases.value = 0
      const x = localStorage.getItem('$$trigrammes')
      let trigs = ['', '']
      try {
        trigs = decode(b64ToU8(x))
      } catch (e) {
        console.log('LocalStorage: entrée $$trigrammes non trouvée / illisible')
      }
      for (const nb in trigs) {
        const i = trigs[nb]
        bases[nb] = { nb: nb, reseau: i[0], trig: i[1], dpbh: [], v1: 0, v2: 0 }
        nbbases.value++
      }
      for (const lsk in localStorage) {
        const i = lsk.indexOf('-')
        if (i === -1 || i === lsk.length) continue
        const reseau = lsk.substring(0, i)
        const dpbh = lsk.substring(i + 1)
        const nb = localStorage.getItem(lsk)
        const x = bases[nb]
        if (x) {
          x.dpbh.push(dpbh)
        } else {
          nbbases.value++
          bases[nb] = { nb: nb, reseau: reseau, trig: '???', dpbh: [dpbh], v1: 0, v2: 0 }
        }
      }
    }

    async function deleteIDB (nombase) {
      try {
        const it = bases[nombase]
        it.dpbh.forEach(dpbh => { localStorage.removeItem(it.reseau + '-' + dpbh) })
        await Dexie.delete(nombase)
        await sleep(100)
        delete bases[nombase]
        nbbases.value = 0
        const trigs = {}
        for (const nb in bases) {
          const it = bases[nb]
          trigs[nb] = [it.reseau, it.trig]
          nbbases.value++
        }
        localStorage.setItem('$$trigrammes', u8ToB64(encode(trigs), true))
        console.log('RAZ db ' + nombase + ' réseau:' + it.reseau + ' trig:' + it.trig)
      } catch (e) {
        console.log(e.toString())
      }
    }

    getBases()

    return {
      session,
      ui,
      bases,
      nbbases,
      deleteIDB
    }
  }

})
</script>

<style lang="sass">
@import '../css/app.sass'
.q-toolbar
  min-height: 0 !important
  padding: 0 !important
</style>
