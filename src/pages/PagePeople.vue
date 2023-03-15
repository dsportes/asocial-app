<template>
  <q-page class="q-pa-sm">
    <div v-if="msg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{msg}}</div>

    <div v-if="lp.length && !flp.length" class="titre-lg text-italic">
      {{$t('APnb', [lp.length])}}
    </div>
    
    <div v-if="flp.length">
      <div v-for="(p, idx) in flp" :key="p.id">
        <apercu-people class="q-my-sm" :id="p.na.id" :idx="idx"/>
      </div>
    </div>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import { $t, hms } from '../app/util.mjs'
import { IDCOMPTABLE } from '../app/api.mjs'

export default {
  name: 'PagePeople',

  components: { ApercuPeople },

  computed: {
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    const pStore = stores.people
    const session = stores.session
    const fStore = stores.filtre

    function getPeople () { // Array de chats (Map des chats (clé ids) de l'avatar id)
      return Array.from(pStore.map.values())
    }

    const lp = ref(getPeople()) // Map des chats (clé ids) de l'avatar id
    const flp = ref()
    const msg = ref('')

    pStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'getElt') {
          lp.value = getPeople()
          filtrer(); trier()
        }
      })
    })
    pStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'del') {
          lp.value = getPeople()
          filtrer(); trier()
        }
      })
    })

    fStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setFiltre' && args[0] === 'people') {
          filtrer(); trier()
        }
      })
    })

    function trier () {
      flp.value.sort((a, b) => { 
        return (a.na.id === IDCOMPTABLE || a.na.nom < b.na.nom) ? -1 : (a.na.nom > b.na.nom ? 1 : 0) 
      })
    }

    function filtrer () {
      let f = fStore.filtre.people
      if (!f) { 
        flp.value = lp.value
        return 
      }
      const r = []
      for (const p of lp.value) {
        if (f.nom && !p.na.nom.startsWith(f.nom)) continue
        if (f.roletr && (p.sp < f.roletr)) continue
        if (f.avecgr && (!p.groupes.size)) continue
        r.push(p)
      }
      flp.value = r
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
      flp,
      lp,
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
