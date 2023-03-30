<template>
  <q-page class="q-pa-sm">
    <div v-if="msg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{msg}}</div>

    <div class="petitelargeur q-my-sm">
      <div class="row">
        <div class="col-6"></div>
        <div class="col-3 fs-md text-italic text-center">Volume V1</div>
        <div class="col-3 fs-md text-italic text-center">Volume V2</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PTattr')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ a1 + ' / ' + ed1(a1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ a2 + ' / ' + ed2(a2)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PTrest')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ (q1 - a1) + ' / ' + ed1(q1 - a1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ (q2 - a2) + ' / ' + ed2(q2 - a2)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PTtotal')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ q1 + ' / ' + ed1(q1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ q2 + ' / ' + ed2(q2)}}</div>
      </div>
    </div>

    <q-separator />

    <q-btn class="q-my-sm" size="md" flat dense color="primary" 
      :label="$t('PTnv')" @click="ouvrirnt"/>

    <div v-if="!ftribus.length" class="titre-lg text-italic">
      {{$t('PTvide', [tribus.length])}}
    </div>

    <div v-if="ftribus.length">
      <div v-for="(tribu, idx) in ftribus" :key="tribu.id">
        <div class="row items-start">
          <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
            :color="tribu.id === session.tribuCId ? 'warning' : 'primary'" @click="courant(tribu.id)"/>
          <apercu-tribu class="q-my-sm" :id="tribu.id" :idx="idx" edit/>
        </div>
      </div>
    </div>

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="nt" persistent>
      <q-card class="moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <nom-avatar icon-valider="check" verif tribu @ok-nom="oknom" />
        <choix-quotas :quotas="quotas" />
        <q-card-actions>
          <q-btn flat dense color="warning" icon="close" :label="$t('renoncer')" @click="closent"/>
          <q-btn flat dense color="primary" icon="check" :disabled="!nom || quotas.err"
            :label="$t('valider')" @click="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'
import NomAvatar from '../components/NomAvatar.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { afficherDiag, hms, $t, edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { NouvelleTribu, GetTribu } from '../app/operations.mjs'

export default {
  name: 'PageChats',

  components: { NomAvatar, ApercuTribu, ChoixQuotas },

  computed: {
  },

  methods: {
    ed1 (n) { return edvol(n * UNITEV1) },
    ed2 (n) { return edvol(n * UNITEV2) },
    ouvrirnt () { 
      this.nom = ''
      this.quotas = { q1: 1, q2: 1, min1: 0, min2: 0, max1: 9999, max2: 9999, err: false }
      this.nt = true
    },
    closent () { this.nt = false },
    async oknom (nom) { 
      for(const tribu of this.tribus) {
        if (tribu.na.nom === nom) {
          await afficherDiag(this.$t('PTex'))
          return
        }
      }
      this.nom = nom
    },
    async creer () {
      await new NouvelleTribu().run(this.nom, this.quotas.q1, this.quotas.q2)
      this.closent()
    },
    async courant (id) {
      const [t ,t2] = await new GetTribu().run(id, true)
      this.avStore.setTribuC(t, t2)
      this.ui.setPage('tribu')
    }
  },

  data () {
    return {
      nom: '',
      nt: false,
      quotas: null
    }
  },

  setup () {
    const avStore = stores.avatar
    const session = stores.session
    const fStore = stores.filtre

    const tribus = ref(avStore.getTribus) // array des tribus
    const ftribus = ref()
    const msg = ref('')

    const a1 = ref(0)
    const a2 = ref(0)
    const q1 = ref(0)
    const q2 = ref(0)

    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTribu' || name === 'seTribu2' || name === 'delTribuC') {
          tribus.value = avStore.getTribus
          filtrer(); trier()
        }
      })
    })

    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTribuCId') {
          tribus.value = avStore.getTribus
          filtrer(); trier()
        }
      })
    })

    fStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setFiltre' && args[0] === 'tribus') {
          filtrer(); trier()
        }
      })
    })

    fStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTri' && args[0] === 'tribus') {
          trier()
        }
      })
    })

    function f0 (a,b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) }
    function f1 (a,b) { return a.a1 > b.a1 ? -1 : (a.a1 < b.a1 ? 1 : f0(a,b)) }
    function f2 (a,b) { return a.a2 > b.a2 ? -1 : (a.a2 < b.a2 ? 1 : f0(a,b)) }
    function f3 (a,b) { return a.q1 - a.a1 > b.q1 - b.a1 ? -1 : (a.q1 - a.a1 < b.q1 - b.a1 ? 1 : f0(a,b)) }
    function f4 (a,b) { return a.q2 - a.a2 > b.q2 - b.a2 ? -1 : (a.q2 - a.a2 < b.q2 - b.a2 ? 1 : f0(a,b)) }
    function f5 (a,b) { return a.q1 > b.q1 ? -1 : (a.q1 < b.q1 ? 1 : f0(a,b)) }
    function f6 (a,b) { return a.q2 > b.q2 ? -1 : (a.q2 < b.q2 ? 1 : f0(a,b)) }

    const fnt = [f0, f1, f2, f3, f4, f5, f6]
    function trier () {
      let f = fStore.tri.tribus
      if (!f) return
      const x = []
      ftribus.value.forEach(t => { x.push(t) })
      x.sort(fnt[f])
      ftribus.value = x
      fmsg()
    }

    function filtrer () {
      a1.value = 0; a2.value = 0; q1.value = 0; q2.value = 0
      let f = fStore.filtre.tribus
      if (!f) { 
        ftribus.value = tribus.value
        return 
      }
      f.limj = f.nbj ? (new Date().getTime() - (f.nbj * 86400000)) : 0
      f.setp = f.mcp && f.mcp.length ? new Set(f.mcp) : new Set()
      f.setn = f.mcn && f.mcn.length ? new Set(f.mcn) : new Set()
      const r = []
      for (const t of tribus.value) {
        a1.value += t.cpt.a1 || 0; a2.value += t.cpt.a2 || 0; q1.value += t.cpt.q1 || 0; q2.value += t.cpt.q2 || 0
        if (f.avecbl && !t.blocage) continue
        if (f.nomt && !t.na.nom.startsWith(f.nomt)) continue
        if (f.txtt && (!t.info || t.info.indexOf(f.txtt) === -1)) continue
        if (f.txtn &&
          (!t.notifco || t.notifco.txt.indexOf(f.txtn) === -1) &&
          (!t.notifcp || t.notifcp.indexOf(f.txtn) === -1)) continue
        if (f.notif) {
          const x = t.cpt.nco || [0, 0]
          const y = t.cpt.nsp || [0, 0]
          if (f.notif === 1 && (x[0] + x[1] + y[0] + y[1] === 0)) continue
          if (f.notif === 2 && (x[1] + y[1] === 0)) continue
        }
        r.push(t)
      }
      ftribus.value = r
      fmsg()
    }

    function fmsg () {
      const r = ftribus.value
      msg.value = hms(new Date(), true) + ' / ' + $t('items', r.length, { count: r.length })
      setTimeout(() => {
        msg.value = ''
      }, 1000)
    }

    filtrer()
    trier()

    return {
      ui: stores.ui,
      avStore,
      session,
      ftribus,
      tribus,
      a1, a2, q1, q2,
      msg
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
