<template>
<div :class="'full-width column ' + sty" :style="'height:' + henrem + 'rem;overflow-y:hidden'">
  <div class="titre-lg text-italic text-bold q-mb-sm">
    <div v-if="tot">{{$t('DTtit1')}}</div>
    <div v-else>{{$t('DTtit0', [ligne.id, admin ? '' : ligne.info])}}</div>
  </div>

  <div class="full-width column" :style="'height:' + (henrem - 2) + 'rem;overflow-y:auto'">
    <apercu-notif v-if="estC || estSp"
      :notif="tribu.notif" :id-tribu="tribu.id" :idx="idx" nom=""/>
    <div v-else>{{$t('DTnbncs', ligne.ntr1, {count: ligne.ntr1})}}</div>

    <div v-if="tot" :class="ligne.ntr2 ? 'text-bold text-warning' : ''">
      {{$t('DTnbncb', ligne.ntr2, {count: ligne.ntr2})}}</div>
    
  <div>
<div>
</template>

<script>

const txt = ['green-3', 'green-3', 'orange-9', 'negative', 'negative', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-2', 'yellow-5',  'yellow-7']
const ic = ['check', 'report', 'alarm_on', 'lock_open', 'lock', 'close']

export default ({
  name: 'DetailTribu',
  props: { 
    henrem: Number,
    ligne: Object // ligne d'une Synthese enrichie 
  },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre ' : 'clair ' },
    tot () { return ligne.id === 0 ? 1 : 0 },
  },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (n) { return edvol(n * UNITEV1) },
    ed2 (n) { return edvol(n * UNITEV2) },
  },

  setup (props) {
    const aSt = stores.avatar
    const session = stores.session
    const ligne = toRef(props, 'ligne')
    const tribu = ref(null)
    const estC = ref(aSt.estComptable)
    const estSp = ref(aSt.estSponsor)

    async function chargtTribu () {
      tribu.value = aSt.getTribu(ligne.value.id)
      if (!tribu.value) tribu.value = await new GetTribu().run(ligne.value.id)
    }

    function besoinTribu () {
      return (estC.value || estSp.value) && ligne.value.id && (ligne.value.ntr1 || ligne.value.ntr2)
    }

    if (besoinTribu()) {
      onMounted(async () => { chargtTribu() })
    }

    watch(() => ligne.value, (ap, av) => {
        if (besoinTribu()) chargtTribu()
      }
    )

    return {
      aSt, session, tribu, estC, estSp
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rond
  position: absolute
  top: -2px
  right: -2px
  border-radius: 6px
  width: 12px
  height: 12px
  background: $red-9
.bord
  border: 1px solid $grey-5
  border-radius: 5px
</style>
