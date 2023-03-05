<template>
  <q-page class="q-pa-sm">
    <div v-if="msg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{msg}}</div>

    <q-btn class="q-my-sm" size="md" flat dense color="primary" 
      :label="$t('PTnv')" @click="ouvrirnt"/>

    <div v-if="!ftribus.length" class="titre-lg text-italic">
      {{$t('PTnch2', [tribus.length])}}
    </div>

    <div v-if="ftribus.length">
      <div v-for="(tribu, idx) in tribus" :key="tribu.id">
        <div class="row items-start">
          <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
            :color="tribu.id === session.tribuId ? 'warning' : 'primary'" @click="courant(tribu.id)"/>
          <apercu-tribu class="q-my-sm" :id="tribu.id" :idx="idx"/>
        </div>
      </div>
    </div>

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="nt" persistent>
      <q-card class="moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('PTnt')}}</div>
        <nom-avatar icon-valider="check" verif tribu
          :label-valider="$t('ok')" @ok-nom="oknom" />
        <choix-quotas :quotas="quotas" />
        <q-card-actions vertical>
          <q-btn flat dense color="warning" :label="$t('renoncer')" @click="closent"/>
          <q-btn flat dense color="primary" :disabled="!nom || quotas.err"
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
import { afficherDiag, hms, $t } from '../app/util.mjs'

export default {
  name: 'PageChats',

  components: { NomAvatar, ApercuTribu },

  computed: {
  },

  methods: {
    ouvrirnt () { 
      this.nom = ''
      this.quotas = { q1: 1, q2: 1, m1: 9999, m2: 9999, err: false }
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
      console.log(this.nom, this.quotas.q1, this.quotas.q2 )
    },
    courant (id) {
      // TODO
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

    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTribuC') {
          tribus.value = avStore.getTribus
          filtrer(); trier()
        }
      })
    })
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'delTribuC') {
          tribus.value = avStore.getTribus
          filtrer(); trier();
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

    function fn (a,b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) }
    function f1 (a,b) { return a.a1 > b.a1 ? -1 : (a.a1 < b.a1 ? 1 : fn(a,b)) }
    function f2 (a,b) { return a.a2 > b.a2 ? -1 : (a.a2 < b.a2 ? 1 : fn(a,b)) }
    function f3 (a,b) { return a.r1 > b.r1 ? -1 : (a.r1 < b.r1 ? 1 : fn(a,b)) }
    function f4 (a,b) { return a.r2 > b.r2 ? -1 : (a.r2 < b.r2 ? 1 : fn(a,b)) }
    function f5 (a,b) { return a.a1 + a.r1 > b.a1 + b.r1 ? -1 : (a.a1 + a.r1 < b.a1 + b.r1 ? 1 : fn(a,b)) }
    function f6 (a,b) { return a.a2 + a.r2 > b.a2 + b.r2 ? -1 : (a.a2 + a.r2 < b.a2 + b.r2 ? 1 : fn(a,b)) }

    const fnt = [null, f1, f2, f3, f4, f5, f6]
    function trier () {
      let f = fStore.tri.tribus
      if (!f) return
      ftribus.value.sort(fnt[f])
    }

    function filtrer () {
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
        if (f.avecbl && !t.blocage) continue
        if (f.nomt && !t.na.nom.startsWith(f.nomt)) continue
        if (f.txtt && (!t.info || t.info.indexOf(f.txtt) === -1)) continue
        if (f.txtn &&
          (!t.notifco || t.notifco.txt.indexOf(f.txtn) === -1) &&
          (!t.notifcp || t.notifcp.indexOf(f.txtn) === -1)) continue
        r.push(t)
      }
      ftribus.value = r
      msg.value = hms(new Date(), true) + ' / ' + $t('items', r.length, { count: r.length })
      setTimeout(() => {
        msg.value = ''
      }, 1000)
    }

    filtrer()
    trier()

    return {
      ui: stores.ui,
      session,
      ftribus,
      tribus,
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
